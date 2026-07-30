import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios' });
  }

  const expectedUsername = 'recepcao';
  const expectedPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'ad2026';

  const isValidUser = username.trim().toLowerCase() === expectedUsername;
  const isValidPass = String(password).trim() === String(expectedPassword).trim();

  if (isValidUser && isValidPass) {
    return res.status(200).json({
      success: true,
      message: 'Autenticado com sucesso',
      user: {
        username: 'recepcao',
        role: 'receptionist',
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Usuário ou senha incorretos.',
  });
}
