import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import WorkspaceMembership, Team, UserProfile, Invitation
from opgaver.models import Opgave, OpgaveKommentar, OpgaveStatusLog, PinboardPost, PinboardPostEvaluation, PinboardPostComment
from vidensbank.models import Viden
from tidsregistrering.models import Tidreg, BrugerProfilTime, BrugerIndstillingTime
from django.db import transaction

def merge_users(keep_id, merge_id):
    try:
        user_keep = User.objects.get(id=keep_id)
        user_merge = User.objects.get(id=merge_id)
    except User.DoesNotExist:
        print("One or both users do not exist.")
        return

    print(f"Merging user {user_merge.username} (ID: {merge_id}) into {user_keep.username} (ID: {keep_id})...")

    with transaction.atomic():
        # 1. WorkspaceMembership
        for membership in WorkspaceMembership.objects.filter(user=user_merge):
            if WorkspaceMembership.objects.filter(user=user_keep, company=membership.company).exists():
                print(f"User {user_keep.username} already member of {membership.company.navn}. Skipping membership from {user_merge.username}.")
                membership.delete()
            else:
                membership.user = user_keep
                membership.save()
                print(f"Moved membership in {membership.company.navn} to {user_keep.username}.")

        # 2. Teams (ManyToMany)
        for team in user_merge.teams.all():
            team.medlemmer.add(user_keep)
            print(f"Added {user_keep.username} to team {team.navn}.")
        
        # 3. Invitations
        Invitation.objects.filter(invited_by=user_merge).update(invited_by=user_keep)
        print("Moved invitations.")

        # 4. Opgaver
        for opgave in user_merge.opgaver_som_ansvarlig.all():
            opgave.ansvarlige.add(user_keep)
        Opgave.objects.filter(oprettet_af=user_merge).update(oprettet_af=user_keep)
        OpgaveKommentar.objects.filter(bruger=user_merge).update(bruger=user_keep)
        OpgaveStatusLog.objects.filter(bruger=user_merge).update(bruger=user_keep)
        print("Moved opgave related data.")

        # 5. Pinboard
        PinboardPost.objects.filter(oprettet_af=user_merge).update(oprettet_af=user_keep)
        PinboardPostEvaluation.objects.filter(bruger=user_merge).update(bruger=user_keep)
        PinboardPostComment.objects.filter(bruger=user_merge).update(bruger=user_keep)
        print("Moved pinboard related data.")

        # 6. Vidensbank
        Viden.objects.filter(oprettet_af=user_merge).update(oprettet_af=user_keep)
        for viden in user_merge.viden_favorites.all():
            viden.favoritter.add(user_keep)
        print("Moved vidensbank related data.")

        # 7. Tidsregistrering
        Tidreg.objects.filter(bruger=user_merge).update(bruger=user_keep)
        BrugerProfilTime.objects.filter(bruger=user_merge).update(bruger=user_keep)
        # BrugerIndstillingTime is OneToOne, we can only keep one.
        BrugerIndstillingTime.objects.filter(bruger=user_merge).delete()
        print("Moved tidsregistrering related data.")

        # 8. UserProfile (OneToOne)
        # We delete the profile of the merged user as we can only have one.
        UserProfile.objects.filter(user=user_merge).delete()
        print("Deleted user profile of merged user.")

        # 9. Delete the user
        user_merge.delete()
        print(f"Deleted user {user_merge.username}.")

if __name__ == "__main__":
    # From previous check: 
    # User ID: 3, Username: WC
    # User ID: 15, Username: cb_admin
    merge_users(3, 15)
