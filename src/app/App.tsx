import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider }         from './contexts/AuthContext';
import { DataProvider }         from './contexts/DataContext';
import { LogProvider }          from './contexts/LogContext';
import { ThemeProvider }        from './contexts/ThemeContext';
import { ClassSessionProvider } from './contexts/ClassSessionContext';
import { Toaster }              from './components/ui/sonner';
import { routes }               from './routes';

function Root() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LogProvider>
          <DataProvider>
            <ClassSessionProvider>
              <Outlet />
              <Toaster />
            </ClassSessionProvider>
          </DataProvider>
        </LogProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    children: routes,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
