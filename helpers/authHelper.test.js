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

        it('should handle errors when hashing fails', async () => {
            // Mock bcrypt.hash to throw an error
            jest.spyOn(bcrypt, 'hash').mockImplementation(() => {
                throw new Error('Hashing failed');
            });

            // Spy on the console.log to capture the error message
            const consoleMessage = jest.spyOn(console, 'log').mockImplementation(() => {});

            const password = "Test@1234";
            const hashedPassword = await hashPassword(password);

            // Check that the error was logged
            expect(consoleMessage).toHaveBeenCalledWith(new Error('Hashing failed'));

            // Check that the hashed password is undefined due to the error
            expect(hashedPassword).toBeUndefined();

            // Restore the original bcrypt.hash implementation
            bcrypt.hash.mockRestore();
            consoleMessage.mockRestore();
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