<?php

namespace App\Controller;

use App\Entity\TextDocument;
use App\Repository\ProjectRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class TextDocumentController extends AbstractController
{
    /**
     * Update TextDocument by ID (alte Route)
     */
    #[Route('/api/textdocument/{id}', name: 'textdocument_update', methods: ['PUT'])]
    public function update(Request $request, TextDocument $textDocument, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content'])) {
            return new JsonResponse(['error' => 'Kein Inhalt übermittelt'], 400);
        }

        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        return new JsonResponse(['status' => 'success']);
    }

    /**
     * 🚀 NEUE ROUTE: Save TextDocument by project SLUG (HAUPT-ROUTE!)
     */
    #[Route('/api/textdocument/save', name: 'textdocument_save', methods: ['POST'])]
    public function save(Request $request, EntityManagerInterface $em, ProjectRepository $projectRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content'])) {
            return new JsonResponse(['error' => 'Inhalt ist erforderlich'], 400);
        }

        // Projekt über SLUG finden (bevorzugt) oder ID (Fallback)
        $project = null;
        if (isset($data['project_slug'])) {
            $project = $projectRepository->findOneBy([
                'slug' => $data['project_slug'],
                'owner' => $this->getUser()
            ]);
        } elseif (isset($data['project_id'])) {
            // Legacy Support für alte JavaScript-Calls
            $project = $projectRepository->findOneBy([
                'id' => $data['project_id'],
                'owner' => $this->getUser()
            ]);
        } else {
            return new JsonResponse(['error' => 'Projekt-Slug oder -ID ist erforderlich'], 400);
        }

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }

        // Aktuelles TextDocument finden oder erstellen
        $textDocument = null;
        foreach ($project->getTextDocuments() as $doc) {
            if ($doc->isCurrent()) {
                $textDocument = $doc;
                break;
            }
        }

        if (!$textDocument) {
            // Neues TextDocument erstellen
            $textDocument = new TextDocument();
            $textDocument->setProject($project);
            $textDocument->setIsCurrent(true);
        }

        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($textDocument);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'id' => $textDocument->getId(),
            'updated_at' => $textDocument->getUpdatedAt()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * 📋 LEGACY: Save TextDocument by project ID (alte Route für Kompatibilität)
     */
    #[Route('/api/textdocument/save-by-id', name: 'textdocument_save_legacy', methods: ['POST'])]
    public function saveLegacy(Request $request, EntityManagerInterface $em, ProjectRepository $projectRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content']) || !isset($data['project_id'])) {
            return new JsonResponse(['error' => 'Inhalt und Projekt-ID sind erforderlich'], 400);
        }

        $project = $projectRepository->findOneBy([
            'id' => $data['project_id'],
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden'], 404);
        }

        // Aktuelles TextDocument finden oder erstellen
        $textDocument = null;
        foreach ($project->getTextDocuments() as $doc) {
            if ($doc->isCurrent()) {
                $textDocument = $doc;
                break;
            }
        }

        if (!$textDocument) {
            // Neues TextDocument erstellen
            $textDocument = new TextDocument();
            $textDocument->setProject($project);
            $textDocument->setIsCurrent(true);
        }

        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($textDocument);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'id' => $textDocument->getId(),
            'updated_at' => $textDocument->getUpdatedAt()->format('Y-m-d H:i:s')
        ]);
    }
}
