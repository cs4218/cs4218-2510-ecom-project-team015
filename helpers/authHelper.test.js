import { hashPassword, comparePassword } from "./authHelper.js";
import bcrypt from "bcrypt";

describe(' Auth Helper Functions', () => {
    describe('hashPassword', () => {
        it('should the password is hashed correctly', async () => {
            const password = "Test@1234";
            const hashedPassword = await hashPassword(password);

            // Check that the hashed password is defined
            expect(hashedPassword).toBeDefined();

            // Check that the hashed password is different from the original password
            expect(hashedPassword).not.toBe(password);

            // Check that the hashed password is a valid
            expect(hashedPassword).toMatch(/^\$2[ayb]\$.{56}$/);
        });
    });

    describe('comparePassword', () => {
        it('should return true for the correct password', async () => {
            const password = "Test@1234";
            const hashedPassword = await bcrypt.hash(password, 10);
            const isMatch = await comparePassword(password, hashedPassword);

            // Check that isMatch is true
            expect(isMatch).toBe(true);
        });

        it('should return false for an incorrect password', async () => {
            const password = "Test@1234";
            const wrongPassword = "Wrong@1234";
            const hashedPassword = await bcrypt.hash(password, 10);
            const isMatch = await comparePassword(wrongPassword, hashedPassword);

            // Check that isMatch is false
            expect(isMatch).toBe(false);
        });

    });
});