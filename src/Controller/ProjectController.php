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

        // TODO: Echten eingeloggten User verwenden
        // Momentan nehmen wir einfach den ersten User aus der DB
        $user = $em->getRepository(AppUser::class)->findOneBy([]);
        
        if (!$user) {
            $this->addFlash('error', 'Kein Benutzer gefunden. Bitte zuerst einen Benutzer erstellen.');
            return $this->redirectToRoute('project_create');
        }

        // Neues Projekt erstellen
        $project = new Project();
        $project->setTitle($title);
        $project->setDescription($description ?: null);
        $project->setOwner($user);
        $project->setCreatedAt(new \DateTimeImmutable());

        $em->persist($project);
        $em->flush();

        $this->addFlash('success', 'Projekt "' . $title . '" wurde erfolgreich erstellt!');
        
        // Direkt zum neuen Projekt weiterleiten
        return $this->redirectToRoute('workspace', ['projectId' => $project->getId()]);
    }

    #[Route('/project/{id}/edit', name: 'project_edit')]
    public function edit(int $id, ProjectRepository $projectRepository): Response
    {
        $project = $projectRepository->find($id);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden.');
        }

        return $this->render('project/edit.html.twig', [
            'project' => $project
        ]);
    }

    #[Route('/project/{id}/update', name: 'project_update', methods: ['POST'])]
    public function update(int $id, Request $request, ProjectRepository $projectRepository, EntityManagerInterface $em): Response
    {
        $project = $projectRepository->find($id);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden.');
        }

        $title = trim($request->request->get('title'));
        $description = trim($request->request->get('description'));

        if (empty($title)) {
            $this->addFlash('error', 'Projekt-Titel ist erforderlich.');
            return $this->redirectToRoute('project_edit', ['id' => $id]);
        }

        $project->setTitle($title);
        $project->setDescription($description ?: null);

        $em->flush();

        $this->addFlash('success', 'Projekt wurde aktualisiert!');
        return $this->redirectToRoute('project_list');
    }

    #[Route('/project/{id}/delete', name: 'project_delete', methods: ['POST'])]
    public function delete(int $id, ProjectRepository $projectRepository, EntityManagerInterface $em): Response
    {
        $project = $projectRepository->find($id);
        
        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden.');
        }

        $title = $project->getTitle();
        $em->remove($project);
        $em->flush();

        $this->addFlash('success', 'Projekt "' . $title . '" wurde gelöscht.');
        return $this->redirectToRoute('project_list');
    }
}