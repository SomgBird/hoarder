import type { UseWizardOptions, WizardErrors, WizardStep } from "./types";


export const validateStep = async <T,>(step: WizardStep<T>, values: T): Promise<WizardErrors<T>> =>
  step.validate ? await step.validate(values) : {};

export function useWizard<T extends Record<string, unknown>>({ steps, initialValues, onFinish }: UseWizardOptions<T>) {
    // Compute values
    // Update values
    // validate, onFinish and submit
}