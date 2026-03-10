from opgaver.models import Opgave
task = Opgave.objects.first()
if task:
    print(f"Status: '{task.status}', Length: {len(task.status)}")
    for val in task.status:
        print(f"Char: '{val}', Ord: {ord(val)}")
else:
    print("No tasks found")
