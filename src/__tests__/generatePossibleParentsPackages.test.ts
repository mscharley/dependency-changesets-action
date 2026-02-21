import { describe, expect, it } from '@jest/globals';
import { generatePossiblesParentsPackages } from '../generatePossiblesParentsPackages.js';

describe('generatePossiblesParentsPackages', () => {
    describe('paths with package.json', () => {
        it('will return an 1 length array with the provided path', () => {
            expect(generatePossiblesParentsPackages("package.json")).toEqual(['package.json']);
            expect(generatePossiblesParentsPackages("example/package.json")).toEqual(['example/package.json']);
            expect(generatePossiblesParentsPackages("example/foo/package.json")).toEqual(['example/foo/package.json']);
        });
    })

    describe('paths without package.json', () => {
        it('will return an dynamic length array with the provided path', () => {
            expect(generatePossiblesParentsPackages("dotnet.csproj")).toEqual(['package.json']);
            expect(generatePossiblesParentsPackages("example/dotnet.csproj")).toEqual(['example/package.json', 'package.json']);
            expect(generatePossiblesParentsPackages("example/foo/dotnet.csproj")).toEqual(['example/foo/package.json', 'example/package.json', 'package.json']);
        });
    })
});
