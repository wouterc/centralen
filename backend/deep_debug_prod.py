from django.contrib.auth.models import User
from core.models import Team
from opgaver.models import Opgave

def debug():
    u = User.objects.get(username='WC')
    print(f"DEBUG: User '{u.username}' (ID: {u.id})")
    print(f"  is_superuser: {u.is_superuser}")
    
    # Check teams
    teams = Team.objects.filter(medlemmer=u)
    print(f"  User is member of: {[(t.id, t.navn) for t in teams]}")
    
    # Check tasks and their teams
    tasks = Opgave.objects.all().order_by('-id')[:10]
    print(f"  Recent tasks in system:")
    for t in tasks:
        print(f"    ID: {t.id}, Titel: '{t.titel}', Team: {t.team_id}, Status: '{t.status}', Oprettet af: {t.oprettet_af_id}")
        if t.team:
            is_member = u in t.team.medlemmer.all()
            print(f"      Team '{t.team.navn}' members: {[m.id for m in t.team.medlemmer.all()]}")
            print(f"      User is member of task's team: {is_member}")

debug()
