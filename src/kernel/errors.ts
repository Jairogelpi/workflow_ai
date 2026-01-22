
import { VerificationResult } from '../canon/schema/receipt';

export class LogicCircuitBreakerError extends Error {
    public violations: NonNullable<VerificationResult['issues']>;

    constructor(message: string, violations: NonNullable<VerificationResult['issues']>) {
        super(message);
        this.name = "LogicCircuitBreakerError";
        this.violations = violations;
    }
}
