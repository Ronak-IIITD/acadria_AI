# LaTeX Math Rendering in StudySync AI

## Overview
StudySync AI supports beautiful LaTeX math rendering using KaTeX. Math equations are automatically rendered in a human-readable format when the AI responds with mathematical content.

## How to Use

### Inline Math
Wrap inline math expressions with single dollar signs:

**Input:** `The quadratic formula is $x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$`

**Renders as:** The quadratic formula is shown inline with proper formatting.

### Display Math (Block)
Wrap display math with double dollar signs for centered equations:

**Input:**
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

**Renders as:** A beautifully centered equation with proper spacing.

## Example Questions to Try

### Basic Algebra
**Ask:** "What is the quadratic formula?"

**AI Response:**
```markdown
The quadratic formula is:

$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

where $a$, $b$, and $c$ are coefficients of the quadratic equation $ax^2 + bx + c = 0$.
```

### Calculus
**Ask:** "What is the derivative of sin(x)?"

**AI Response:**
```markdown
The derivative of $\sin(x)$ is:

$$\frac{d}{dx}\sin(x) = \cos(x)$$
```

### Linear Algebra
**Ask:** "Show me a matrix multiplication example"

**AI Response:**
```markdown
Matrix multiplication:

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
e & f \\
g & h
\end{bmatrix}
=
\begin{bmatrix}
ae+bg & af+bh \\
ce+dg & cf+dh
\end{bmatrix}
$$
```

### Statistics
**Ask:** "What is the normal distribution formula?"

**AI Response:**
```markdown
The probability density function of the normal distribution is:

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$

where $\mu$ is the mean and $\sigma$ is the standard deviation.
```

### Complex Equations
**Ask:** "Explain Euler's identity"

**AI Response:**
```markdown
Euler's identity is one of the most beautiful equations in mathematics:

$$e^{i\pi} + 1 = 0$$

This connects five fundamental mathematical constants: $e$ (Euler's number), $i$ (imaginary unit), $\pi$ (pi), $1$, and $0$.
```

## Supported LaTeX Commands

### Greek Letters
- Lowercase: `\alpha`, `\beta`, `\gamma`, `\delta`, `\epsilon`, `\theta`, `\lambda`, `\mu`, `\pi`, `\sigma`, `\omega`
- Uppercase: `\Gamma`, `\Delta`, `\Theta`, `\Lambda`, `\Pi`, `\Sigma`, `\Omega`

### Mathematical Operators
- Fractions: `\frac{numerator}{denominator}`
- Square root: `\sqrt{x}` or `\sqrt[n]{x}`
- Summation: `\sum_{i=1}^{n}`
- Integration: `\int_{a}^{b}`, `\iint`, `\iiint`
- Product: `\prod_{i=1}^{n}`
- Limits: `\lim_{x \to \infty}`

### Calculus
- Derivatives: `\frac{d}{dx}`, `\frac{\partial}{\partial x}`
- Integrals: `\int`, `\oint`, `\iint`

### Matrices
```latex
\begin{matrix}
a & b \\
c & d
\end{matrix}
```

Or with brackets:
```latex
\begin{bmatrix}
1 & 2 \\
3 & 4
\end{bmatrix}
```

### Special Symbols
- Infinity: `\infty`
- Plus/minus: `\pm`, `\mp`
- Multiplication: `\times`, `\cdot`
- Division: `\div`
- Less than/greater than: `\leq`, `\geq`, `\neq`
- Arrows: `\rightarrow`, `\leftarrow`, `\Rightarrow`, `\Leftarrow`
- Set notation: `\in`, `\notin`, `\subset`, `\cup`, `\cap`

### Grouping
- Parentheses: `\left( \right)`
- Brackets: `\left[ \right]`
- Braces: `\left\{ \right\}`
- Angle brackets: `\langle \rangle`
- Auto-sizing: `\left` and `\right` automatically size delimiters

## Technical Details

### Setup
The math rendering is powered by:
- **remark-math**: Parses math syntax in markdown
- **rehype-katex**: Renders LaTeX using KaTeX
- **KaTeX**: Fast math typesetting library

### Integration
Math rendering is automatically enabled in the chat window. The system:
1. Detects `$...$` for inline math
2. Detects `$$...$$` for display math
3. Renders using KaTeX for fast, beautiful output
4. Supports both light and dark themes

### Styling
Math equations automatically adapt to your theme:
- **Light mode**: Dark text on light background
- **Dark mode**: Light text with proper contrast
- **Font size**: Scales appropriately with surrounding text
- **Spacing**: Proper vertical spacing for display equations

## Tips for Best Results

1. **Use double dollar signs** for important equations you want centered
2. **Use single dollar signs** for math within sentences
3. **Add spaces** around operators for better readability
4. **Break long equations** across multiple lines when needed
5. **Use `\text{}` for text** within math mode: `$\text{distance} = \sqrt{x^2 + y^2}$`

## Example Conversation

**User:** "Can you explain the Pythagorean theorem?"

**AI:** 
```markdown
The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides:

$$a^2 + b^2 = c^2$$

where $c$ is the length of the hypotenuse, and $a$ and $b$ are the lengths of the other two sides.

For example, if $a = 3$ and $b = 4$, then:

$$c = \sqrt{3^2 + 4^2} = \sqrt{9 + 16} = \sqrt{25} = 5$$
```

This renders beautifully with proper mathematical notation! ✨

## Common Math Problems It Handles

✅ Algebra (equations, polynomials, functions)
✅ Calculus (derivatives, integrals, limits)
✅ Linear Algebra (matrices, vectors, determinants)
✅ Statistics (distributions, probability)
✅ Trigonometry (sin, cos, tan, identities)
✅ Number Theory (primes, divisibility)
✅ Geometry (formulas, proofs)
✅ Complex Numbers (operations, polar form)

## No Configuration Needed!

Just ask math questions naturally, and the AI will respond with properly formatted LaTeX equations that render beautifully in both light and dark modes. 🎓✨
