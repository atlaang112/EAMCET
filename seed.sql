INSERT INTO papers (id, name, subject, created_at) VALUES
('matrices-01', 'Matrices — Mixed Practice', 'Mathematics', '2026-03-30'),
('trigonometry-01', 'Trigonometry — Basics', 'Mathematics', '2026-03-30'),
('calculus-01', 'Calculus — Limits & Derivatives', 'Mathematics', '2026-03-30');

INSERT INTO questions (paper_id, qno, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty) VALUES
('matrices-01', 1, 'If A = [[1,0],[0,1]], then A is called a:', 'Zero Matrix', 'Identity Matrix', 'Scalar Matrix', 'Diagonal Matrix', 1, 'vvery-easy'),
('matrices-01', 2, 'The order of a matrix with 3 rows and 4 columns is:', '4×3', '3×3', '3×4', '4×4', 2, 'vvery-easy'),
('matrices-01', 3, 'For a matrix A of order m×n, the transpose Aᵀ has order:', 'm×n', 'm×m', 'n×m', 'n×n', 2, 'vvery-easy'),
('matrices-01', 4, 'If A = [[2,3],[4,5]], what is the element a₂₁?', '2', '3', '5', '4', 3, 'vvery-easy'),
('matrices-01', 5, 'A square matrix where all off-diagonal elements are zero is called a:', 'Row matrix', 'Unit matrix', 'Column matrix', 'Diagonal matrix', 3, 'vvery-easy'),
('matrices-01', 6, 'If A = [[1,2],[3,4]], then det(A) is:', '−2', '10', '2', '−10', 0, 'very-easy'),
('matrices-01', 7, 'If A = [[a,b],[c,d]], then trace tr(A) is:', 'ad−bc', 'a+d', 'a+b+c+d', 'bc−ad', 1, 'very-easy'),
('matrices-01', 8, 'Which of the following is a skew-symmetric matrix?', '[[1,2],[2,1]]', '[[0,1],[1,0]]', '[[1,0],[0,1]]', '[[0,−3],[3,0]]', 3, 'very-easy'),
('matrices-01', 9, 'For matrices A and B of compatible orders, (AB)ᵀ equals:', 'AᵀBᵀ', 'BᵀAᵀ', 'ABᵀ', 'AᵀB', 1, 'very-easy'),
('matrices-01', 10, 'If A is a 2×2 matrix and k is scalar, then det(kA) equals:', 'k·det(A)', 'k²·det(A)', 'det(A)', 'k³·det(A)', 1, 'very-easy'),
('trigonometry-01', 1, 'sin²θ + cos²θ equals:', '0', '2', '1', '−1', 2, 'vvery-easy'),
('trigonometry-01', 2, 'The value of sin 90° is:', '0', '1', '−1', '∞', 1, 'vvery-easy'),
('trigonometry-01', 3, 'cos 0° equals:', '0', '−1', '∞', '1', 3, 'vvery-easy'),
('trigonometry-01', 4, 'tan θ is equal to:', 'cosθ/sinθ', 'sinθ/cosθ', '1/sinθ', '1/cosθ', 1, 'vvery-easy'),
('trigonometry-01', 5, '1 + tan²θ equals:', 'sec²θ', 'cosec²θ', 'cot²θ', 'cos²θ', 0, 'vvery-easy'),
('calculus-01', 1, 'lim(x→0) sinx/x equals:', '0', '∞', 'x', '1', 3, 'vvery-easy'),
('calculus-01', 2, 'd/dx(xⁿ) equals:', 'xⁿ', 'nxⁿ', '(n−1)xⁿ', 'nxⁿ⁻¹', 3, 'vvery-easy'),
('calculus-01', 3, 'd/dx(sin x) equals:', '−sinx', 'cosx', '−cosx', 'tanx', 1, 'vvery-easy'),
('calculus-01', 4, 'd/dx(eˣ) equals:', 'xeˣ⁻¹', 'eˣ⁺¹', '0', 'eˣ', 3, 'vvery-easy'),
('calculus-01', 5, 'd/dx(constant) equals:', '1', '∞', 'the constant itself', '0', 3, 'vvery-easy');
