import os
import re

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # 1. Add "use client" if it has react hooks or jsx and not already there
    if '"use client"' not in content and "'use client'" not in content:
        # insert after comments
        if content.startswith('/*'):
            end_comment = content.find('*/') + 2
            content = content[:end_comment] + '\n"use client";\n' + content[end_comment:]
        else:
            content = '"use client";\n' + content
        modified = True

    # 2. Replace Link imports
    if 'react-router-dom' in content:
        # replace Link import
        content = re.sub(r"import\s*{\s*([^}]*)\s*}\s*from\s*['\"]react-router-dom['\"];?", 
                         lambda m: handle_router_import(m.group(1)), content)
        modified = True

    # 3. Replace Link 'to=' with 'href='
    if '<Link ' in content:
        content = re.sub(r'(<Link[^>]+)to=', r'\1href=', content)
        modified = True

    # 4. Replace useNavigate and useLocation
    if 'useNavigate' in content:
        content = content.replace('useNavigate', 'useRouter')
        content = content.replace('navigate(', 'router.push(')
        modified = True
    if 'useLocation' in content:
        content = content.replace('useLocation', 'usePathname')
        content = content.replace('location.pathname', 'pathname')
        modified = True

    if modified and content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated {filepath}")

def handle_router_import(imports_str):
    imports = [i.strip() for i in imports_str.split(',')]
    next_imports = []
    nav_imports = []
    other = []
    
    for i in imports:
        if i == 'Link':
            next_imports.append("import Link from 'next/link';")
        elif i == 'useNavigate':
            nav_imports.append('useRouter')
        elif i == 'useLocation':
            nav_imports.append('usePathname')
        else:
            other.append(i)
            
    res = "\n".join(next_imports) + "\n"
    if nav_imports:
        res += f"import {{ {', '.join(nav_imports)} }} from 'next/navigation';\n"
    if other:
        # just comment out others for manual review
        res += f"// TODO: handle react-router-dom imports: {', '.join(other)}\n"
        
    return res

def migrate_directory(dirpath):
    for root, dirs, files in os.walk(dirpath):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                migrate_file(os.path.join(root, file))

if __name__ == '__main__':
    migrate_directory('src/pages')
    migrate_directory('src/components')
    migrate_directory('src/context')
