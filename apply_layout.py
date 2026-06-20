import re

files = ['app/templates/index.html', 'app/templates/result.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Background texture
    content = content.replace('bg-[#F8FAFC] text-[#0F172A]', 'bg-[#F8FAFC] bg-texture text-[#0F172A]')
    
    # 2. Sidebar cards inner layering
    content = content.replace('bg-white/5 border border-white/10', 'sidebar-card')
    content = content.replace('bg-black/20', '') # remove old backgrounds if present
    
    # 3. Upload Zones inset shadows
    def fix_drop(match):
        cls = match.group(0)
        cls = cls.replace('surface-card', '')
        cls = cls.replace('bg-[#FFFFFF]', '')
        cls = cls.replace('class="', 'class="upload-zone ')
        return cls
    content = re.sub(r'id="drop-[12]" class="[^"]*"', fix_drop, content)
    
    # 4. Metadata panels
    def fix_meta(match):
        return 'absolute bottom-0 w-full p-3 bg-[#F1F5F9] border-t border-[#E2E8F0]'
    content = re.sub(r'absolute bottom-0 w-full p-\d+ bg-[^\s"]+', fix_meta, content)
    
    # Fix the text colors inside metadata panels so they are dark (since background is light F1F5F9)
    # The span texts were text-white and text-slate-300
    # I'll let that be for now, wait, the meta texts must be readable. Let's do a more targeted replace:
    content = content.replace('id="file-name-1" class="text-white', 'id="file-name-1" class="text-[#0F172A]')
    content = content.replace('id="file-name-2" class="text-white', 'id="file-name-2" class="text-[#0F172A]')
    content = content.replace('text-slate-300', 'text-[#64748B]')
    content = content.replace('text-slate-400', 'text-[#94A3B8]') # ensure placeholders are readable
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
