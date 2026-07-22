"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const DrawerRoot = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DrawerContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  direction?: "right" | "left";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Must mirror the `open` prop on the parent DrawerRoot so AnimatePresence
   *  can keep the content in the DOM during the exit animation. */
  open?: boolean;
}

const sizeMap = {
  sm: "w-96",
  md: "w-[28rem]",
  lg: "w-[32rem]",
  xl: "w-[40rem]",
  full: "w-full",
};

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(
  (
    { className, children, direction = "right", size = "lg", open, ...props },
    ref,
  ) => {
    const isRight = direction === "right";
    return (
      // forceMount keeps the portal alive so the exit animation can complete
      // before React removes the subtree from the DOM.
      <DrawerPortal forceMount>
        <AnimatePresence>
          {open && (
            <React.Fragment key="drawer">
              <DrawerOverlay />
              <DialogPrimitive.Content ref={ref} forceMount asChild {...props}>
                <motion.div
                  initial={{ x: isRight ? "100%" : "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: isRight ? "100%" : "-100%" }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className={cn(
                    "fixed z-50 h-full bg-[var(--bg-card)] shadow-2xl outline-none",
                    "flex flex-col",
                    isRight
                      ? "inset-y-0 right-0 border-l border-[var(--border)]"
                      : "inset-y-0 left-0 border-r border-[var(--border)]",
                    sizeMap[size],
                    className,
                  )}
                >
                  {children}
                </motion.div>
              </DialogPrimitive.Content>
            </React.Fragment>
          )}
        </AnimatePresence>
      </DrawerPortal>
    );
  },
);
DrawerContent.displayName = DialogPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0",
      className,
    )}
  >
    {children}
  </div>
);

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)]",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-[var(--text-tertiary)]", className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

const DrawerFooter = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "px-5 py-4 border-t border-[var(--border)] flex-shrink-0",
      className,
    )}
  >
    {children}
  </div>
);

export {
  DrawerRoot,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
