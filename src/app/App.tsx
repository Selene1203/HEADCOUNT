import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider }         from './contexts/AuthContext';
import { DataProvider }         from './contexts/DataContext';
import { LogProvider }          from './contexts/LogContext';
import { ThemeProvider }        from './contexts/ThemeContext';
import { ClassSessionProvider } from './contexts/ClassSessionContext';
import { Toaster }              from './components/ui/sonner';
import { routes }               from './routes';
import { LoadingPage }          from './components/LoadingPage';

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <LoadingPage />;

  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <ThemeProvider>
          <LogProvider>
            <DataProvider>
              <ClassSessionProvider>
                <Root />
              </ClassSessionProvider>
            </DataProvider>
          </LogProvider>
        </ThemeProvider>
      </AuthProvider>
    ),
    children: routes,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
