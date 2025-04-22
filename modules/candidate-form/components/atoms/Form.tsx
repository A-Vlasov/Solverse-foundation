import React, { FormEvent } from 'react';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const Form: React.FC<FormProps> = ({ children, onSubmit }) => (
  <form className="space-y-6" onSubmit={onSubmit}>
    {children}
  </form>
);

export default Form; 