# Code Canvas Feature

## Overview
The Code Canvas feature displays code blocks in a beautiful, interactive format similar to modern AI assistants like ChatGPT, Claude, and GitHub Copilot.

## Features
✅ Syntax highlighting for multiple languages
✅ Line numbers
✅ Copy to clipboard button
✅ Language/filename display in header
✅ macOS-style window dots
✅ Dark/Light mode support
✅ Scrollable for long code
✅ Seamless markdown integration

## How It Works

When the AI responds with code blocks in markdown format, they are automatically rendered using the CodeCanvas component instead of plain markdown code blocks.

### Example Markdown Input

When you ask the AI a coding question, it will respond with code in markdown format:

````markdown
Here's a BFS implementation in Java:

```java
import java.util.*;

public class BFSExample {
    public static void bfs(int start, List<List<Integer>> adj) {
        int n = adj.size();
        boolean[] visited = new boolean[n];
        Queue<Integer> q = new LinkedList<>();
        
        visited[start] = true;
        q.add(start);
        
        while (!q.isEmpty()) {
            int node = q.poll();
            System.out.print(node + " ");
            
            for (int neighbor : adj.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    q.add(neighbor);
                }
            }
        }
    }
}
```
````

This will automatically render as a beautiful code canvas with:
- Header showing "Java" (or filename if specified)
- macOS-style window dots (red, yellow, green)
- Copy code button
- Syntax-highlighted code with line numbers
- Dark/Light mode support

## Supported Languages

The CodeCanvas supports all languages that Prism.js supports, including:
- JavaScript / TypeScript
- Python
- Java
- C / C++ / C#
- HTML / CSS
- SQL
- Bash / Shell
- And many more...

## Usage Tips

### For Users
Simply ask coding questions naturally:
- "How do I implement a binary search in Python?"
- "Show me a React component for a todo list"
- "Write a SQL query to join two tables"

The AI will respond with properly formatted code that renders beautifully.

### For Developers
The CodeCanvas component is automatically integrated into the chat window. Code blocks in markdown are detected and rendered using the custom component.

No special configuration needed - it just works! 🎉

## Technical Details

### Component Location
- `src/components/CodeCanvas.tsx` - The main component
- `src/components/CalmChatWindow.tsx` - Integration point

### Key Dependencies
- `react-syntax-highlighter` - For syntax highlighting
- `react-markdown` - For markdown parsing

### Customization
You can customize the appearance by modifying the CSS variables in `CodeCanvas.tsx`:
- Border radius: `var(--radius-xl)`
- Colors: `var(--color-bg-elevated)`, `var(--color-border-medium)`
- Shadows: `var(--shadow-md)`
