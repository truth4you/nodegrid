import Header from "components/Header"; // Components: Header
import Footer from "components/Footer"; // Components: Footer
import type { ReactElement } from "react"; // Types

export default function Layout({
  children,
}: {
  children: ReactElement | ReactElement[];
}) {
  return (
    <div className="container md:mx-auto">
      <Header />
      <div>{children}</div>
      <Footer />
    </div>
  );
}
