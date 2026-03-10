from django.contrib.auth.models import User
from core.models import Team, UserProfile
from opgaver.models import Opgave

try:
    u = User.objects.get(username='WC')
    print(f"User: {u.username}")
    print(f"  is_superuser: {u.is_superuser}")
    print(f"  is_staff: {u.is_staff}")
    
    try:
        p = u.profile
        print(f"  Profile Role: {p.role}")
    except:
        print(f"  No profile found")

    teams = u.teams.all()
    print(f"  Member of teams: {[t.navn for t in teams]}")

    all_teams = Team.objects.all()
    print(f"  All teams in system: {[t.navn for t in all_teams]}")

    for t in all_teams:
        tasks_count = Opgave.objects.filter(team=t).count()
        is_member = u in t.medlemmer.all()
        print(f"  Team '{t.navn}' (ID: {t.id}): {tasks_count} tasks, User is member: {is_member}")

    null_team_tasks = Opgave.objects.filter(team__isnull=True).count()
    print(f"  Tasks with no team: {null_team_tasks}")

except User.DoesNotExist:
    print("User WC not found")
except Exception as e:
    print(f"Error: {e}")
