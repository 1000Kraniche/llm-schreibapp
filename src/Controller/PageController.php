<?php

namespace App\Controller;

use App\Repository\ProjectRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PageController extends AbstractController
{
    #[Route('/', name: 'home')]
    public function index(): Response
    {
        return $this->render('page/index.html.twig');
    }

    #[Route('/workspace/{projectId}', name: 'workspace')]
    public function workspace(int $projectId, ProjectRepository $projectRepository): Response
    {
        $project = $projectRepository->find($projectId);

        if (!$project) {
            throw $this->createNotFoundException('Projekt nicht gefunden.');
        }

        $textDocument = $project->getTextDocument();

        return $this->render('page/workspace.html.twig', [
            'project' => $project,
            'text_document' => $textDocument,
        ]);
    }

    #[Route('/workspace-demo', name: 'workspace_demo')]
    public function workspaceDemo(): Response
    {
        return $this->render('page/workspace-demo.html.twig', [
            'content' => '### Demo-Inhalt\n\nDies ist ein *Testdokument*, um den Editor ohne Projekt zu prüfen.',
        ]);
    }

    #[Route('/project-list', name: 'project_list')]
    public function projectList(ProjectRepository $projectRepository): Response
    {
    $projects = $projectRepository->findAll();

        return $this->render('page/project-list.html.twig', [
            'projects' => $projects,
    ]);
}
}
