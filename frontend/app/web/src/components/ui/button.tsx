import type { ButtonHTMLAttributes, PropsWithChildren } from "react"

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: "primary" | "secondary" | "ghost"
}

export const Button = (props: ButtonProps) => (
  <button {...props} className={`button button-${props.variant ?? "primary"} ${props.className ?? ""}`} />
)
