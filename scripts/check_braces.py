
import sys

def count_braces(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        line_num = i + 1
        for char in line:
            if char == '{':
                stack.append(line_num)
            elif char == '}':
                if not stack:
                    print(f"Excess closing brace at line {line_num}")
                else:
                    stack.pop()
    
    if stack:
        print(f"Unclosed braces opened at lines: {stack}")
    else:
        print("Braces are balanced.")

if __name__ == "__main__":
    count_braces(sys.argv[1])
