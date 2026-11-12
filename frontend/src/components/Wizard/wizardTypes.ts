import type { ReactElement, ReactNode } from "react";


export type WizardStatus = 'idle' | 'validating' | 'submitting';


// Represents a single step in the wizard
export interface WizardStep {
    title: string;
    content: ReactNode;
    validate?: () => string | null; // Return an empty object when valid.
    nextDisabled?: boolean;         // For dead-end steps: the button stays disabled
}


// Props for the Wizard component
export interface WizardProps {
    title: string;
    icon?: ReactElement;
    imageSrc?: string;
    showImage?: boolean;
    showSteps?: boolean;

    onCancel: () => void;
    onFinish: () => void;
    confirmCancel: boolean; // Show a confirmation dialog when canceling
    steps: WizardStep[];
}