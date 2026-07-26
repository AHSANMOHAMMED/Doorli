const fs = require('fs');
const path = require('path');
const https = require('https');

const data = JSON.parse(fs.readFileSync('screens.json', 'utf8'));
const screens = Array.isArray(data) ? data : data.screens;

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function processScreens() {
  for (const screen of screens) {
    if (!screen.htmlCode || !screen.htmlCode.downloadUrl) continue;
    
    const title = screen.title || 'Untitled';
    const slug = slugify(title);
    if (!slug) continue;

    console.log(`Processing: ${title} -> /${slug}`);
    
    try {
      let html = await download(screen.htmlCode.downloadUrl);
      
      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (!bodyMatch) {
        console.log(`Skipping ${title} - no body found.`);
        continue;
      }
      
      let content = bodyMatch[1];
      
      // Remove scripts
      content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove inline styles
      content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      // Basic JSX conversions
      content = content.replace(/class=/g, 'className=');
      content = content.replace(/for=/g, 'htmlFor=');
      content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
      
      // Self-close void elements
      const voidTags = ['input', 'img', 'br', 'hr', 'meta', 'link'];
      voidTags.forEach(tag => {
        const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
        content = content.replace(regex, `<${tag}$1 />`);
      });
      
      // Remove style="" props to avoid React compile errors
      content = content.replace(/style="[^"]*"/g, '');

      // Handle SVG props
      content = content.replace(/stroke-width/g, 'strokeWidth');
      content = content.replace(/stroke-linecap/g, 'strokeLinecap');
      content = content.replace(/stroke-linejoin/g, 'strokeLinejoin');
      content = content.replace(/fill-rule/g, 'fillRule');
      content = content.replace(/clip-rule/g, 'clipRule');
      
      // Wrap in a React component
      const tsx = `"use client";\n\nimport React from 'react';\n\nexport default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {\n  return (\n    <div className="min-h-screen bg-[#121212] text-[#e5e2e1]">\n      ${content}\n    </div>\n  );\n}\n`;
      
      const dir = path.join(__dirname, 'src', 'app', slug);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'page.tsx'), tsx);
      
      console.log(`  -> Created src/app/${slug}/page.tsx`);
      
    } catch (e) {
      console.error(`Error processing ${title}:`, e.message);
    }
  }
}

processScreens();
