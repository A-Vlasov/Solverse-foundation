import jwt from 'jsonwebtoken';

import { Employee } from '@/modules/dashboard/lib/supabase'; 


const JWT_SECRET = process.env.JWT_SECRET;

const TOKEN_EXPIRY = '7d';


interface JwtPayload {
  sub: string; 
  name: string;
  telegram_id: string;
}

/**
 * Генерирует JWT токен для сотрудника
 */
export function generateToken(employee: Employee): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  if (!employee.id || !employee.first_name || !employee.telegram_id) {
     throw new Error('Cannot generate token for employee with missing ID, name, or telegram_id');
  }
  
  const payload: JwtPayload = {
    sub: employee.id,
    name: employee.first_name,
    telegram_id: employee.telegram_id,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

/**
 * Валидирует JWT токен и возвращает данные пользователя
 */
export async function validateToken(token: string): Promise<{ isValid: boolean; user: Omit<User, 'role'> | null }> {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined.');
    return { isValid: false, user: null };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    
    
    
    
    
    
    
    
    
    return {
      isValid: true,
      user: {
        id: decoded.sub,
        name: decoded.name,
        telegram_id: decoded.telegram_id
      }
    };
    
  } catch (error) {
    
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Token validation error:', error.message);
    } else {
      console.error('Unexpected token validation error:', error);
    }
    return { isValid: false, user: null };
  }
}


interface User {
  id: string;
  name: string;
  telegram_id: string;
  
} 