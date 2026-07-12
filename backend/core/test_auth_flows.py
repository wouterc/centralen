"""
Centralen Autentificering og Arbejdsrum Integrationstests

Dette script udfører automatiserede tests for hele registrerings-, login-,
kontoaktiverings-, password-reset-, invitations- og workspace-oprettelsesflowet.

Kørsel af tests:
    For at køre disse tests lokalt i dit virtuelle miljø (venv), skal du køre
    følgende kommando i terminalen fra mappen 'backend':
    
        python manage.py test core.test_auth_flows

Bemærk:
    Testene kører i en isoleret test-database, som automatisk oprettes og slettes
    af Django. Dette sikrer, at dine lokale udviklingsdata ikke ændres.
"""

from django.contrib.auth.models import User
from django.core import signing
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from core.models import (
    Company, Team, WorkspaceMembership, Invitation, 
    WorkspaceRequest, PasswordResetRequest, UITranslation
)

class AuthenticationTests(APITestCase):
    def setUp(self):
        # Opret standard oversættelser for at undgå fejl under e-mail simulering
        UITranslation.objects.get_or_create(
            key='email.activation.subject',
            defaults={'en': 'Activate account', 'da': 'Aktiver konto'}
        )
        UITranslation.objects.get_or_create(
            key='email.activation.body',
            defaults={'en': 'Link: {{link}}', 'da': 'Link: {{link}}'}
        )
        UITranslation.objects.get_or_create(
            key='email.password_reset.subject',
            defaults={'en': 'Reset password', 'da': 'Nulstil adgangskode'}
        )
        UITranslation.objects.get_or_create(
            key='email.password_reset.body',
            defaults={'en': 'Link: {{link}}', 'da': 'Link: {{link}}'}
        )
        UITranslation.objects.get_or_create(
            key='email.invitation.subject',
            defaults={'en': 'Invitation', 'da': 'Invitation'}
        )
        UITranslation.objects.get_or_create(
            key='email.invitation.body',
            defaults={'en': 'Link: {{link}}', 'da': 'Link: {{link}}'}
        )

        # Rens databasen for at sikre en ren testkontekst
        User.objects.all().delete()
        Company.objects.all().delete()

    def test_register_user_success(self):
        """Test at en bruger kan registrere sig succesfuldt som inaktiv."""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'secretpassword123',
            'first_name': 'Test',
            'last_name': 'Bruger',
            'website': ''  # Honeypot skal være tomt
        }
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        
        # Tjek databasen
        user = User.objects.filter(username='testuser').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.email, 'test@example.com')
        self.assertFalse(user.is_active)  # Skal være inaktiv indtil link klikkes

    def test_register_user_honeypot(self):
        """Test at honeypot (website felt) ignorerer oprettelsen uden at give fejl."""
        data = {
            'username': 'botuser',
            'email': 'bot@example.com',
            'password': 'botpassword123',
            'first_name': 'Bot',
            'last_name': 'Spammer',
            'website': 'http://spamsite.com'  # Fyldt honeypot trigger
        }
        response = self.client.post('/api/register/', data)
        # Svarer 200 for at narre botten
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Men ingen bruger oprettes i databasen
        user_exists = User.objects.filter(username='botuser').exists()
        self.assertFalse(user_exists)

    def test_register_user_validation(self):
        """Test valideringsfejl ved dubleret brugernavn, e-mail og manglende felter."""
        # Opret en eksisterende bruger
        User.objects.create_user(username='eksisterende', email='eksisterende@example.com', password='password123')

        # Dubleret brugernavn
        data = {
            'username': 'eksisterende',
            'email': 'ny@example.com',
            'password': 'password123',
            'website': ''
        }
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'username_taken')

        # Dubleret e-mail
        data['username'] = 'nyusername'
        data['email'] = 'eksisterende@example.com'
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'email_taken')

        # Manglende felter
        data = {'username': '', 'email': '', 'password': '', 'website': ''}
        response = self.client.post('/api/register/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'missing_fields')

    def test_activate_user_success(self):
        """Test succesfuld aktivering via token og auto-oprettelse af workspace."""
        user = User.objects.create_user(
            username='aktivermig',
            email='aktiver@example.com',
            password='password123',
            first_name='Aktiver',
            last_name='Mig'
        )
        user.is_active = False
        user.save()

        # Generer gyldigt token
        token = signing.dumps({'user_id': user.id})

        response = self.client.post(f'/api/activate-account/{token}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Tjek database og aktiveringsstatus
        user.refresh_from_db()
        self.assertTrue(user.is_active)

        # Tjek at standard arbejdsrum ("Mit Lab") er oprettet
        membership = WorkspaceMembership.objects.filter(user=user).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.company.navn, 'Mit Lab')
        self.assertEqual(membership.role, 'ADMIN')

        # Tjek at standard team og videnskategori er oprettet til det nye workspace
        self.assertTrue(Team.objects.filter(company=membership.company, navn='Generelt').exists())

    def test_activate_user_expired_token(self):
        """Test at udløbne aktiveringstokens afvises."""
        response = self.client.post('/api/activate-account/forkert_token/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'activation_link_invalid')

    def test_resend_activation_view(self):
        """Test gensendelse af aktiveringslink med beskyttelse mod scanning."""
        user = User.objects.create_user(username='inaktiv', email='inaktiv@example.com', password='password123')
        user.is_active = False
        user.save()

        # Eksisterende inaktiv konto
        response = self.client.post('/api/resend-activation/', {'email': 'inaktiv@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # Ikke-eksisterende e-mail (skal stadig returnere success 200 for anonymitet)
        response = self.client.post('/api/resend-activation/', {'email': 'findesikke@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

    def test_login_flow(self):
        """Test login scenarier (succes, inaktiv bruger, forkerte loginoplysninger)."""
        user = User.objects.create_user(username='loginuser', email='login@example.com', password='password123')
        
        # 1. Korrekte loginoplysninger (Aktiv bruger)
        response = self.client.post('/api/login/', {'email': 'login@example.com', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'login@example.com')

        # 2. Inaktiv bruger
        user.is_active = False
        user.save()
        response = self.client.post('/api/login/', {'email': 'login@example.com', 'password': 'password123'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['code'], 'not_activated')

        # 3. Forkert kode
        user.is_active = True
        user.save()
        response = self.client.post('/api/login/', {'email': 'login@example.com', 'password': 'forkertkode'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['code'], 'invalid_credentials')

    def test_password_reset_flow(self):
        """Test fuldt nulstillingsflow af adgangskode."""
        user = User.objects.create_user(username='resetuser', email='reset@example.com', password='oldpassword')

        # 1. Anmod om nulstilling
        response = self.client.post('/api/password-reset/request/', {'email': 'reset@example.com'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        reset_req = PasswordResetRequest.objects.filter(user=user).first()
        self.assertIsNotNone(reset_req)

        # 2. Nulstil adgangskode med token
        reset_data = {
            'token': str(reset_req.token),
            'password': 'newpassword123'
        }
        response = self.client.post('/api/password-reset/reset/', reset_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')

        # Verificer at nyt password virker
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpassword123'))

        # Tjek at token ikke kan genbruges
        response = self.client.post('/api/password-reset/reset/', reset_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['code'], 'invalid_token')

    def test_workspace_request_flow(self):
        """Test anmodning om nyt arbejdsrum og bekræftelsesflow."""
        # 1. Anmodning oprettes
        response = self.client.post('/api/workspace-requests/', {'email': 'owner@example.com', 'company_name': 'Nyt Firma'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        req = WorkspaceRequest.objects.filter(email='owner@example.com').first()
        self.assertIsNotNone(req)

        # 2. Bekræft anmodning (GET info)
        response = self.client.get(f'/api/workspace-requests/confirm/{req.token}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['company_name'], 'Nyt Firma')
        self.assertFalse(response.data['user_exists'])

        # 3. Bekræft anmodning (POST opretter user + company)
        confirm_data = {
            'password': 'ownerpassword123',
            'first_name': 'Firma',
            'last_name': 'Ejer'
        }
        response = self.client.post(f'/api/workspace-requests/confirm/{req.token}/', confirm_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Arbejdsrum oprettet!')

        # Verificer DB
        company = Company.objects.filter(navn='Nyt Firma').first()
        self.assertIsNotNone(company)

        user = User.objects.filter(email='owner@example.com').first()
        self.assertIsNotNone(user)
        self.assertTrue(user.is_active)

        membership = WorkspaceMembership.objects.filter(user=user, company=company).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.role, 'ADMIN')

    def test_invitation_flow(self):
        """Test invitationsflowet for en gæst til et arbejdsrum."""
        admin_user = User.objects.create_user(username='admin', email='admin@example.com', password='password123')
        company = Company.objects.create(navn='Kunde A')
        WorkspaceMembership.objects.create(user=admin_user, company=company, role='ADMIN')

        # Log admin ind for at kunne sende invitationen
        self.client.force_authenticate(user=admin_user)
        
        # Send invitation
        response = self.client.post(
            '/api/invitations/', 
            {'email': 'guest@example.com', 'role': 'MEMBER'},
            HTTP_X_ACTIVE_COMPANY_ID=str(company.id)
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        inv = Invitation.objects.filter(email='guest@example.com').first()
        self.assertIsNotNone(inv)

        # Log ud igen for at modtage som anonym gæst
        self.client.force_authenticate(user=None)

        # 2. Accepter
        accept_data = {
            'password': 'guestpassword123',
            'first_name': 'Gæst',
            'last_name': 'Bruger'
        }
        response = self.client.post(f'/api/accept-invitation/{inv.token}/', accept_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Invitation accepteret!')

        guest = User.objects.filter(email='guest@example.com').first()
        self.assertIsNotNone(guest)
        
        membership = WorkspaceMembership.objects.filter(user=guest, company=company).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.role, 'MEMBER')
