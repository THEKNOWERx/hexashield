import os
import re

app_dir = "src/app"

def fix_imports_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # depth calculates how many directories deep we are relative to src/app
    # e.g. src/app/dashboard/page.jsx -> depth = 1
    # src/app/reports/[id]/page.jsx -> depth = 2
    rel_path = os.path.relpath(filepath, app_dir)
    depth = rel_path.count(os.sep)
    
    if depth == 0:
        return # src/app/page.jsx, no fix needed

    original_content = content
    modified = False

    # if depth=1, we need to add one more '../' to imports starting with '../'
    # if depth=2, we need to add two more '../'
    
    prefix_to_add = '../' * depth
    
    def replacer(match):
        # match.group(1) is the 'import { ... } from "' part
        # match.group(2) is the current path e.g. '../components/...'
        # match.group(3) is the '"' or "'"
        import_stmt = match.group(0)
        path = match.group(2)
        if path.startswith('../'):
            new_path = path.replace('../', '../' + prefix_to_add, 1)
            return match.group(1) + new_path + match.group(3)
        elif path.startswith('./'):
             # if they used ./ it was to access something in the same directory (like another page). But pages usually don't do that.
             # If it was a component, it's now in app/..., which might be wrong.
             pass
        return import_stmt

    # Regex to match import ... from '../...'
    content = re.sub(r'(import.*?from\s*[\'"])(.*?)([\'"])', replacer, content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {filepath}")

for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith('.jsx'):
            fix_imports_in_file(os.path.join(root, file))

