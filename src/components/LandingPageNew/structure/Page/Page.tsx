import React from "react";

interface PageProps {
  headData?: any;
  className?: string;
  children?: React.ReactNode;
}

const Page: React.FC<PageProps> = ({
  children,
  headData,
  className = "bg-white max-w-full overflow-hidden",
}) => {
  return (
    <section className={className}>
      {children}
    </section>
  );
};

export default Page;
