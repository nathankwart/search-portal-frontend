import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/auth";
import { AppShell, BrowseGate, RequireAuth } from "@/shell";
import { CurrencyProvider } from "@/lib/currency";
import { flushOnHide } from "@/lib/track";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";

const HomePage = lazy(() => import("@/pages/HomePage").then((module) => ({ default: module.HomePage })));
const SearchPage = lazy(() => import("@/pages/SearchPage").then((module) => ({ default: module.SearchPage })));
const ProductPage = lazy(() => import("@/pages/ProductPage").then((module) => ({ default: module.ProductPage })));
const SupplierPage = lazy(() => import("@/pages/SupplierPage").then((module) => ({ default: module.SupplierPage })));
const CartPage = lazy(() => import("@/pages/CartPage").then((module) => ({ default: module.CartPage })));
const InquiryListPage = lazy(() => import("@/pages/InquiriesPage").then((module) => ({ default: module.InquiryListPage })));
const InquiryDetailPage = lazy(() => import("@/pages/InquiriesPage").then((module) => ({ default: module.InquiryDetailPage })));
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function Screen({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-muted" aria-busy="true" />}>{children}</Suspense>;
}

function TrackerMount() {
  useEffect(() => {
    const onHide = () => flushOnHide();
    window.addEventListener("pagehide", onHide);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushOnHide();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return null;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    element: <BrowseGate />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Screen><HomePage /></Screen> },
          { path: "search", element: <Screen><SearchPage /></Screen> },
          { path: "products/:id", element: <Screen><ProductPage /></Screen> },
          { path: "suppliers/:id", element: <Screen><SupplierPage /></Screen> },
          {
            element: <RequireAuth />,
            children: [
              { path: "cart", element: <Screen><CartPage /></Screen> },
              { path: "inquiries", element: <Screen><InquiryListPage /></Screen> },
              { path: "inquiries/:id", element: <Screen><InquiryDetailPage /></Screen> },
              { path: "profile", element: <Screen><ProfilePage /></Screen> },
            ],
          },
          { path: "*", element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TrackerMount />
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
