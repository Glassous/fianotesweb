
export const parseFrontmatter = (text: string) => {
  const pattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = text.match(pattern);
  
  if (!match) {
    return { data: {}, content: text };
  }

  const yaml = match[1];
  const content = match[2];
  
  const data: Record<string, any> = {};
  
  // Very basic YAML parser
  yaml.split('\n').forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join(':').trim();
      
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      // Remove single quotes
      if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      
      // Handle arrays like [a, b] - basic support
      if (value.startsWith('[') && value.endsWith(']')) {
          data[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else {
          data[key] = value;
      }
    }
  });

  return { data, content };
};
