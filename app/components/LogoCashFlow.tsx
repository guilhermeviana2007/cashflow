import Image from "next/image";

/** Só o ícone quadrado (pequeno) */
export function LogoIcon({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt="Cash Flow"
      width={size}
      height={size}
      priority
      className="rounded-xl shrink-0"
    />
  );
}

/** Ícone pequeno + texto lado a lado (para sidebar) */
export function LogoHorizontal() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoIcon size={32} />
      <div>
        <div className="text-sm font-bold leading-tight tracking-tight">
          <span className="text-foreground">Cash </span>
          <span className="text-primary">Flow</span>
        </div>
      </div>
    </div>
  );
}

/** Versão vertical com subtítulo (para login/cadastro) */
export function LogoVertical({ subtitulo }: { subtitulo?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Image
        src="/logo-vertical.png"
        alt="Cash Flow"
        width={160}
        height={160}
        priority
        className="h-auto w-auto rounded-3xl"
      />
      {subtitulo && (
        <p className="text-muted text-sm">{subtitulo}</p>
      )}
    </div>
  );
}
