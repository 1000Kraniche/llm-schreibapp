<?php

namespace App\Controller;

use App\Entity\Project;
use App\Repository\ProjectRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PageController extends AbstractController
{
    /**
     * Homepage - Startseite der App
     */
    #[Route('/', name: 'home')]
    public function index(): Response
    {
        return $this->render('page/index.html.twig');
    }

    /**
     * Projekt-Liste - Alle Projekte des aktuellen Users
     */
    #[Route('/project-list', name: 'project_list')]
    public function projectList(ProjectRepository $projectRepository): Response
    {
        // Nur Projekte des aktuellen Users laden
        if ($this->getUser()) {
            $projects = $projectRepository->findBy(['owner' => $this->getUser()]);
        } else {
            // Nicht eingeloggte User haben keine Projekte
            $projects = [];
        }

        return $this->render('page/project-list.html.twig', [
            'projects' => $projects,
        ]);
    }

    /**
     * Workspace - Hauptarbeitsbereich mit Editor (mit Slug!)
     */
    #[Route('/workspace/{slug}', name: 'workspace')]
    public function workspace(string $slug, ProjectRepository $projectRepository): Response
    {
        // Projekt über Slug und Owner laden
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden oder du hast keinen Zugriff darauf.');
        }

        // Das aktuelle TextDocument finden
        $textDocument = null;
        foreach ($project->getTextDocuments() as $doc) {
            if ($doc->isCurrent()) {
                $textDocument = $doc;
                break;
            }
        }

        // Falls kein aktuelles Dokument existiert, Default-Inhalt
        if (!$textDocument) {
            $content = '<h1>' . htmlspecialchars($project->getTitle()) . '</h1><p>Beginne hier zu schreiben...</p>';
        } else {
            $content = $textDocument->getContent();
        }

        return $this->render('page/workspace.html.twig', [
            'project' => $project,
            'text_document' => $textDocument,
            'content' => $content
        ]);
    }

    /**
     * API: Neues Projekt erstellen
     */
    #[Route('/api/project/create', name: 'api_project_create', methods: ['POST'])]
    public function createProject(Request $request, EntityManagerInterface $em, ProjectRepository $projectRepository): JsonResponse
    {
        // Login erforderlich
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);
        $title = $data['title'] ?? null;

        if (!$title || trim($title) === '') {
            return new JsonResponse(['error' => 'Projekttitel ist erforderlich'], 400);
        }

        $title = trim($title);

        // Slug erstellen
        $baseSlug = $this->createSlug($title);
        $slug = $this->getUniqueSlug($baseSlug, $projectRepository);

        // Neues Projekt erstellen
        $project = new Project();
        $project->setTitle($title);
        $project->setSlug($slug);
        $project->setOwner($this->getUser());
        $project->setCreatedAt(new \DateTimeImmutable());
        $project->setDescription(''); // Optional

        $em->persist($project);
        $em->flush();

        return new JsonResponse([
            'success' => true,
            'project' => [
                'id' => $project->getId(),
                'title' => $project->getTitle(),
                'slug' => $project->getSlug(),
                'workspace_url' => $this->generateUrl('workspace', ['slug' => $project->getSlug()])
            ]
        ]);
    }

    /**
     * Workspace Demo - Für Tests ohne Projekt (öffentlich zugänglich)
     */
    #[Route('/workspace-demo', name: 'workspace_demo')]
    public function workspaceDemo(): Response
    {
        return $this->render('page/workspace-demo.html.twig', [
            'content' => '<h1>Demo-Workspace</h1><p>Dies ist ein <strong>Testdokument</strong>, um den Editor ohne Projekt zu prüfen.</p>',
        ]);
    }

    /**
     * Hilfe-Seite - FAQ, LLM Status, Shortcuts (öffentlich zugänglich)
     */
    #[Route('/help', name: 'help')]
    public function help(): Response
    {
        return $this->render('page/help.html.twig');
    }

    /**
     * Einstellungen - App & Account Konfiguration (Login erforderlich)
     */
    #[Route('/settings', name: 'settings')]
    public function settings(): Response
    {
        // Settings nur für eingeloggte User
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        
        return $this->render('page/settings.html.twig');
    }

    /**
     * Profil - User-Übersicht und Statistiken (Login erforderlich)
     */
    #[Route('/profile', name: 'profile')]
    public function profile(): Response
    {
        // Profil nur für eingeloggte User
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        
        // TODO: Echte User-Statistiken aus DB laden
        // Beispiel: Anzahl Projekte, Wörter, Notizen des aktuellen Users
        
        return $this->render('page/profile.html.twig');
    }

    /**
     * Impressum - Rechtliche Angaben (öffentlich zugänglich)
     */
    #[Route('/impressum', name: 'impressum')]
    public function impressum(): Response
    {
        return $this->render('page/impressum.html.twig');
    }

    /**
     * API: Projekt löschen
     */
    #[Route('/api/project/{slug}/delete', name: 'api_project_delete', methods: ['DELETE'])]
    public function deleteProject(string $slug, ProjectRepository $projectRepository, EntityManagerInterface $em): JsonResponse
    {
        // Login erforderlich
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        // Projekt finden und Ownership prüfen
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder du hast keinen Zugriff'], 404);
        }

        try {
            // Projekt löschen (Cascade löscht automatisch TextDocuments, Notes, LLMInteractions)
            $em->remove($project);
            $em->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Projekt erfolgreich gelöscht'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Fehler beim Löschen des Projekts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Datenschutz - DSGVO Erklärung (öffentlich zugänglich)
     */
    #[Route('/datenschutz', name: 'datenschutz')]
    public function datenschutz(): Response
    {
        return $this->render('page/datenschutz.html.twig');
    }

    // ================================================================
    // PRIVATE HELPER METHODS
    // ================================================================

    /**
     * Erstellt einen URL-freundlichen Slug aus einem Titel
     */
    private function createSlug(string $title): string
    {
        // Deutsche Umlaute ersetzen
        $slug = str_replace(['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'], 
                           ['ae', 'oe', 'ue', 'ss', 'ae', 'oe', 'ue'], $title);
        
        // Kleinbuchstaben
        $slug = strtolower($slug);
        
        // Nur Buchstaben, Zahlen und Bindestriche erlauben
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        
        // Mehrfache Bindestriche entfernen
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Bindestriche am Anfang/Ende entfernen
        $slug = trim($slug, '-');
        
        // Falls leer, Fallback
        if (empty($slug)) {
            $slug = 'projekt';
        }
        
        return $slug;
    }

    /**
     * Stellt sicher, dass der Slug einzigartig ist für den aktuellen User
     */
    private function getUniqueSlug(string $baseSlug, ProjectRepository $projectRepository): string
    {
        $slug = $baseSlug;
        $counter = 1;

        // Prüfen ob Slug bereits existiert (für diesen User)
        while ($projectRepository->findOneBy(['slug' => $slug, 'owner' => $this->getUser()])) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}