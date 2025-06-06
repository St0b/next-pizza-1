import React from 'react';

interface Props {
  code: string;
}

export const VerificationUserTemplate: React.FC<Props> = ({ code }) => (
  <div>
    <p>
      Код подтверждения: <h2>{code}</h2>
    </p>

    <p>
      <a href={`https://next-pizza-1-ivory.vercel.app/api/auth/verify?code=${code}`}>Подтвердить регистрацию</a>
    </p>
  </div>
);
