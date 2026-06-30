import type { Metadata } from "next";
import { FormMenuPro } from "./FormMenuPro";

export const metadata: Metadata = {
  title: "MenuPro — Cadastro de Cardápio Digital",
  description:
    "Preencha seus dados para contratação e estruturação do seu cardápio digital com a MenuPro.",
};

export default function MenuProPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Cabeçalho com logo */}
        <header className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/menupro-logo-horizontal.jpeg"
            alt="MenuPro"
            className="mx-auto h-20 sm:h-24 w-auto rounded-xl"
          />
          <h1 className="mt-6 text-2xl sm:text-3xl font-bold">
            Vamos montar seu <span className="text-[#E2231A]">cardápio digital</span>
          </h1>
          <p className="mt-2 text-white/60 text-sm sm:text-base max-w-md mx-auto">
            Preencha as informações abaixo para iniciarmos a contratação e a estruturação
            do seu cardápio. Leva menos de 5 minutos.
          </p>
        </header>

        <FormMenuPro />

        <footer className="mt-10 text-center text-xs text-white/30">
          MenuPro · Cardápio Digital · Análise Estratégica · Estruturação
        </footer>
      </div>
    </div>
  );
}
