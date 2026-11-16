import type { ReactElement, ReactNode } from "react";
import type { HelpTopicId } from "@config/help";


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
    helpTopic?: HelpTopicId;

    onCancel: () => void;
    onFinish: () => void;
    confirmCancel: boolean; // Show a confirmation dialog when canceling
    steps: WizardStep[];
}
