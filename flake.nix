{
  description = "Medusa Plugin Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    nixpkgs-unstable.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    {
      self,
      nixpkgs,
      nixpkgs-unstable,
    }:
    let
      forAllSystems = nixpkgs.lib.genAttrs [
        "x86_64-linux"
        "aarch64-darwin"
      ];
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };
          pkgs-unstable = import nixpkgs-unstable {
            inherit system;
          };
          common = with pkgs; [
            nodejs_22
            pnpm
          ];

        in
        pkgs.mkShell {
          packages = common;
        }
      );

      devShell.aarch64-darwin = self.devShells.aarch64-darwin;
      devShell.x86_64-linux = self.devShells.x86_64-linux;
    };
}
