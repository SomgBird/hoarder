import type { ReactElement, ReactNode } from "react";


// Field-level errors, keyed by the wizard value they belong to.
export type WizardErrors<T> = Partial<Record<keyof T, string>>;
 
export type WizardStatus = 'idle' | 'validating' | 'submitting';

// Stores the values of the wizard and provides methods to update them
export interface StepContext <T> {
    values: T;
    setValue: <K extends keyof T>(key: K, value: T[K]) => void;
    patch(values: Partial<T>): void;
    busy: boolean;
}

// Represents a single step in the wizard
export interface WizardStep<T> {
    id: string;
    title: string;
    description?: string;
    render: (ctx: StepContext<T>) => ReactNode;
    validate?: (values: T) => WizardErrors<T> | Promise<WizardErrors<T>>; // Return an empty object when valid.
}

// Options for the useWizard hook
export interface UseWizardOptions<T> {
  steps: WizardStep<T>[];
  initialValues: T;
  onFinish: (values: T) => void | Promise<void>;
}

// Props for the Wizard component
export interface WizardProps<T extends object>  extends UseWizardOptions<T> {
    title: string;
    icon?: ReactElement;
    sidebar?: boolean; // Show the sidebar with the list of steps
    onCancel: () => void;
    confirmCancel: boolean; // Show a confirmation dialog when canceling
}