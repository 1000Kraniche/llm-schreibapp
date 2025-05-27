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

        // Das aktuelle TextDocument finden
        $textDocument = null;
        foreach ($project->getTextDocuments() as $doc) {
            if ($doc->isCurrent()) {
                $textDocument = $doc;
                break;
            }
        }

        if (!$textDocument) {
            // Falls kein aktuelles Dokument existiert, ein leeres erstellen
            $content = '<h1>Neues Dokument</h1><p>Beginne hier zu schreiben...</p>';
        } else {
            $content = $textDocument->getContent();
        }

        return $this->render('page/workspace.html.twig', [
            'project' => $project,
            'text_document' => $textDocument,
            'content' => $content
        ]);
    }

    #[Route('/workspace-demo', name: 'workspace_demo')]
    public function workspaceDemo(): Response
    {
        return $this->render('page/workspace-demo.html.twig', [
            'content' => '### Demo-Inhalt\n\nDies ist ein *Testdokument*, um den Editor ohne Projekt zu prüfen.',
        ]);
    }

    #[Route('/workspace-demo-test', name: 'workspace_demo_test')]
    public function workspaceDemoTest(): Response
    {
        return $this->render('page/workspace-demo-test.html.twig', [
            'content' => '<h1>Summernote Test-Editor</h1><p>Das ist ein <strong>neuer Editor</strong> zum Testen. Hier können wir <em>experimentieren</em> ohne den alten Editor kaputt zu machen!</p><ul><li>Listen funktionieren</li><li>Formatierung auch</li></ul>',
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