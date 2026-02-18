import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, Scale, FileText, ArrowRight, UploadCloud } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-accent/30 via-background to-background">
          <div className="container px-4 md:px-6 w-full -mt-[120px]">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Le Droit Guinéen, <span className="text-primary">Accessible à Tous</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                  Accédez facilement aux lois, décrets et au Journal Officiel de la République de Guinée.
                </p>
              </div>
              <div className="w-full max-w-4xl px-4">
                <SearchBar />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 border rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card">
                <div className="p-4 bg-primary/10 rounded-full">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Les Codes</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Code Civil, Code Pénal, Code du Travail... Tous les codes en vigueur.
                </p>
                <Link href="/recherche?type=code" className="text-primary hover:underline inline-flex items-center">
                  Consulter <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 border rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Scale className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Lois et Décrets</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  L'ensemble des textes législatifs et réglementaires.
                </p>
                <Link href="/recherche?type=loi" className="text-primary hover:underline inline-flex items-center">
                  Consulter <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 border rounded-3xl hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-card">
                <div className="p-4 bg-primary/10 rounded-full">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Journal Officiel</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Consultez les dernières parutions du Journal Officiel.
                </p>
                <Link href="/jo" className="text-primary hover:underline inline-flex items-center">
                  Consulter <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Admin Section */}
        <section className="w-full py-12 bg-muted/30 border-t">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter">Espace Administration</h2>
                <p className="max-w-[600px] text-gray-500 md:text-lg dark:text-gray-400">
                  Outils de gestion pour mettre à jour la base de données juridique.
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/admin">
                  <Button className="gap-2">
                    <UploadCloud className="h-4 w-4" />
                    Importer un texte (PDF)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
