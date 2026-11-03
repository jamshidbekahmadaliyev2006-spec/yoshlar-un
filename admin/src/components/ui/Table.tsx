import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: React.ReactNode[];
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '', ...props }) => {
  return (
    <div className="ov">
      <table className={`tb ${className}`.trim()} {...props}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
};

