'use client';

import React from "react";
import styles from "./Button.module.css";

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

const Button = (props: ButtonProps, ref: React.Ref<HTMLButtonElement>) => {
  return (
    <button
      ref={ref}
      {...props}
      className={`${styles.button} ${props.className || ""}`}
      style={{
        background: '#ea5f52',
        color: 'white',
        padding: '12px 32px',
        fontSize: '18px',
        borderRadius: '16px',
        boxShadow: '-4px 4px #be392c',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        ...props.style
      }}
    >
      {props.children}
    </button>
  );
};
export default React.forwardRef(Button);
