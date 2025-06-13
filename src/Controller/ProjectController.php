<?php

namespace App\Controller;

use App\Entity\Project;
use App\Entity\AppUser;
use App\Repository\ProjectRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ProjectController extends AbstractController
{
    #[Route('/project/create', name: 'project_create')]
    public function create(): Response
    {
        return $this->render('project/create.html.twig');
    }

    #[Route('/project/store', name: 'project_store', methods: ['POST'])]
    public function store(Request $request, EntityManagerInterface $em): Response
    {
        $title = trim($request->request->get('title'));
        $description = trim($request->request->get('description'));

        // Validierung
        if (empty($title)) {
            $this->addFlash('error', 'Projekt-Titel ist erforderlich.');
            return $this->redirectToRoute('project_create');
        }

        // Aktuellen User verwenden
        $user = $this->getUser();
        
        if (!$user) {
            $this->addFlash('error', 'Du musst angemeldet sein um Projekte zu erstellen.');
            return $this->redirectToRoute('app_login');
        }

        // Slug generieren
        $slug = $this->createSlug($title);
        $uniqueSlug = $this->getUniqueSlug($slug, $em->getRepository(Project::class));

        // Neues Projekt erstellen
        $project = new Project();
        $project->setTitle($title);
        $project->setSlug($uniqueSlug);
        $project->setDescription($description ?: null);
        $project->setOwner($user);
        $project->setCreatedAt(new \DateTimeImmutable());

        $em->persist($project);
        $em->flush();

        $this->addFlash('success', 'Projekt "' . $title . '" wurde erfolgreich erstellt!');
        
        // Direkt zum neuen Projekt weiterleiten (mit Slug!)
        return $this->redirectToRoute('workspace', ['slug' => $project->getSlug()]);
    }

    #[Route('/project/{slug}/edit', name: 'project_edit')]
    public function edit(string $slug, ProjectRepository $projectRepository): Response
    {
        // Projekt über Slug und Owner finden
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden oder du hast keinen Zugriff.');
        }

        return $this->render('project/edit.html.twig', [
            'project' => $project
        ]);
    }

    #[Route('/project/{slug}/update', name: 'project_update', methods: ['POST'])]
    public function update(string $slug, Request $request, ProjectRepository $projectRepository, EntityManagerInterface $em): Response
    {
        // Projekt über Slug und Owner finden
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden oder du hast keinen Zugriff.');
        }

        $title = trim($request->request->get('title'));
        $description = trim($request->request->get('description'));

        if (empty($title)) {
            $this->addFlash('error', 'Projekt-Titel ist erforderlich.');
            return $this->redirectToRoute('project_edit', ['slug' => $slug]);
        }

        // Falls Titel geändert wurde, neuen Slug generieren
        if ($title !== $project->getTitle()) {
            $newSlug = $this->createSlug($title);
            $uniqueSlug = $this->getUniqueSlug($newSlug, $projectRepository, $project->getId());
            $project->setSlug($uniqueSlug);
        }

        $project->setTitle($title);
        $project->setDescription($description ?: null);

        $em->flush();

        $this->addFlash('success', 'Projekt wurde aktualisiert!');
        return $this->redirectToRoute('project_list');
    }

    #[Route('/project/{slug}/delete', name: 'project_delete', methods: ['POST'])]
    public function delete(string $slug, ProjectRepository $projectRepository, EntityManagerInterface $em): Response
    {
        // Projekt über Slug und Owner finden
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden oder du hast keinen Zugriff.');
        }

        $title = $project->getTitle();
        $em->remove($project);
        $em->flush();

        $this->addFlash('success', 'Projekt "' . $title . '" wurde gelöscht.');
        return $this->redirectToRoute('project_list');
    }

    // ================================================================
    // PRIVATE HELPER METHODS (gleiche wie im PageController)
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
    private function getUniqueSlug(string $baseSlug, ProjectRepository $projectRepository, ?int $excludeId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        // Prüfen ob Slug bereits existiert (für diesen User, außer dem aktuellen Projekt)
        while (true) {
            $existingProject = $projectRepository->findOneBy(['slug' => $slug, 'owner' => $this->getUser()]);
            
            // Wenn kein Projekt gefunden oder es ist das aktuelle Projekt (bei Updates)
            if (!$existingProject || ($excludeId && $existingProject->getId() === $excludeId)) {
                break;
            }
            
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}