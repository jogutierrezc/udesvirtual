import CarouselManagement from "../CarouselManagement";

export const CarouselPage = () => {
  // This page is rendered inside App.tsx already wrapped with <AdminLayout />
  // Avoid double-wrapping the layout to prevent rendering the admin navbar twice.
  return <CarouselManagement />;
};
