import React from 'react';
import { getEmployees, getRecentTestSessions } from '../../src/lib/supabase';
import Link from 'next/link';

// Компонент для отображения информационной карточки
function Card({ title, value, color }: { title: string, value: string | number, color: string }) {
  return (
    <div className={`p-6 rounded-lg shadow-md ${color} text-white`}>
      <div className="text-lg font-semibold mb-2">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}

// Компонент для отображения данных сотрудника
function EmployeeRow({ employee }: { employee: any }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        <Link href={`/employee/${employee.id}`} className="text-blue-600 hover:underline">
          {employee.first_name}
        </Link>
      </td>
      <td className="py-3 px-4">{employee.department || '-'}</td>
      <td className="py-3 px-4">{employee.level || '-'}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs ${
          employee.status === 'active' ? 'bg-green-100 text-green-800' :
          employee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {employee.status || 'Не указан'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        <Link 
          href={`/employee/${employee.id}`} 
          className="inline-block px-3 py-1 bg-blue-600 text-white rounded mr-2 text-sm"
        >
          Профиль
        </Link>
        <Link 
          href={`/start-test/${employee.id}`} 
          className="inline-block px-3 py-1 bg-green-600 text-white rounded text-sm"
        >
          Тест
        </Link>
      </td>
    </tr>
  );
}

// Компонент для отображения данных сессии
function SessionRow({ session }: { session: any }) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4">
        {new Date(session.created_at).toLocaleString()}
      </td>
      <td className="py-3 px-4">
        <Link href={`/employee/${session.employee_id}`} className="text-blue-600 hover:underline">
          {session.employee_name || 'Неизвестный сотрудник'}
        </Link>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs ${
          session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {session.completed ? 'Завершена' : 'В процессе'}
        </span>
      </td>
      <td className="py-3 px-4 text-right">
        {session.completed ? (
          <Link 
            href={`/test-results/${session.id}`} 
            className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Результаты
          </Link>
        ) : (
          <Link 
            href={`/chat?sessionId=${session.id}`} 
            className="inline-block px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Продолжить
          </Link>
        )}
      </td>
    </tr>
  );
}

// Основной компонент страницы дашборда
export default async function Dashboard() {
  // Получаем список сотрудников
  const employees = await getEmployees();
  
  // Получаем последние тестовые сессии
  const recentSessions = await getRecentTestSessions(5);
  
  // Рассчитываем метрики для карточек
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length;
  const completedSessions = recentSessions.filter(session => session.completed).length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Панель управления OnlyFans</h1>
      
      {/* Информационные карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Всего сотрудников" value={totalEmployees} color="bg-blue-600" />
        <Card title="Активные сотрудники" value={activeEmployees} color="bg-green-600" />
        <Card title="Ожидающие" value={pendingEmployees} color="bg-yellow-600" />
        <Card title="Завершенные тесты" value={completedSessions} color="bg-purple-600" />
      </div>
      
      {/* Список сотрудников */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Сотрудники</h2>
          <Link 
            href="/employees" 
            className="text-blue-600 hover:underline"
          >
            Смотреть всех
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Имя</th>
                <th className="py-3 px-4 text-left">Отдел</th>
                <th className="py-3 px-4 text-left">Уровень</th>
                <th className="py-3 px-4 text-left">Статус</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((employee) => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Последние тестовые сессии */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Последние тесты</h2>
          <Link 
            href="/test-sessions" 
            className="text-blue-600 hover:underline"
          >
            Смотреть все
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Дата</th>
                <th className="py-3 px-4 text-left">Сотрудник</th>
                <th className="py-3 px-4 text-left">Статус</th>
                <th className="py-3 px-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 