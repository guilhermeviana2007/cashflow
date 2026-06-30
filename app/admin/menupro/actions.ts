"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

export async function marcarLido(id: string, lido: boolean) {
  await exigirAdmin();
  await prisma.formularioMenuPro.update({
    where: { id },
    data: { lido },
  });
  revalidatePath("/admin/menupro");
}

export async function excluirFormulario(id: string) {
  await exigirAdmin();
  await prisma.formularioMenuPro.delete({ where: { id } });
  revalidatePath("/admin/menupro");
}
