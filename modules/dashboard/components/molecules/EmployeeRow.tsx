import React from 'react';
import Avatar from '../atoms/Avatar';

interface EmployeeRowProps {
  employee: {
    id: string;
    first_name?: string;
    telegram_tag?: string;
  };
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => (
  <tr className="border-b border-dark-3 transition-colors">
    <td className="py-3 px-4 text-gray-100">
      <div className="flex items-center">
        <Avatar name={employee.first_name} className="mr-3" />
        <div>
          <div className="font-medium">{employee.first_name || 'Без имени'}</div>
          {employee.telegram_tag && (
            <div className="text-sm text-blue-400">{employee.telegram_tag}</div>
          )}
        </div>
      </div>
    </td>
  </tr>
);

export default EmployeeRow; 