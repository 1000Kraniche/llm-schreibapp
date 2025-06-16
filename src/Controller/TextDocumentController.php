<?php

namespace App\Controller;

use App\Entity\TextDocument;
use App\Repository\ProjectRepository;
use App\Repository\TextDocumentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class TextDocumentController extends AbstractController
{
    /**
     * Content speichern mit Slug (NEU)
     */
    #[Route('/api/textdocument/save-by-slug', name: 'api_textdocument_save_by_slug', methods: ['POST'])]
    public function saveContentBySlug(Request $request, ProjectRepository $projectRepository, TextDocumentRepository $textDocumentRepository, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);

        if (!isset($data['project_slug']) || !isset($data['content'])) {
            return new JsonResponse(['error' => 'project_slug und content sind erforderlich'], 400);
        }

        $project = $projectRepository->findOneBy([
            'slug' => $data['project_slug'],
            'owner' => $this->getUser()
        ]);

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
            $textDocument = new TextDocument();
            $textDocument->setProject($project);
            $textDocument->setCurrent(true);
            $textDocument->setCreatedAt(new \DateTimeImmutable());
            $textDocument->setTitle($project->getTitle() . ' - Hauptdokument');
        }

        // Content direkt speichern (NICHT als JSON!)
        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($textDocument);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'message' => 'Content erfolgreich gespeichert',
            'document_id' => $textDocument->getId(),
            'project_slug' => $project->getSlug(),
            'saved_at' => $textDocument->getUpdatedAt()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * Content speichern mit ID (Backward Compatibility)
     */
    #[Route('/api/textdocument/save', name: 'api_textdocument_save', methods: ['POST'])]
    public function saveContent(Request $request, ProjectRepository $projectRepository, TextDocumentRepository $textDocumentRepository, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);

        if (!isset($data['project_id']) || !isset($data['content'])) {
            return new JsonResponse(['error' => 'project_id und content sind erforderlich'], 400);
        }

        $project = $projectRepository->findOneBy([
            'id' => $data['project_id'],
            'owner' => $this->getUser()
        ]);

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
            $textDocument = new TextDocument();
            $textDocument->setProject($project);
            $textDocument->setCurrent(true);
            $textDocument->setCreatedAt(new \DateTimeImmutable());
            $textDocument->setTitle($project->getTitle() . ' - Hauptdokument');
        }

        // Content direkt speichern (NICHT als JSON!)
        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());

        $em->persist($textDocument);
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'message' => 'Content erfolgreich gespeichert',
            'document_id' => $textDocument->getId(),
            'project_id' => $project->getId(),
            'saved_at' => $textDocument->getUpdatedAt()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * Original Update-Methode (Backward Compatibility)
     */
    #[Route('/api/textdocument/{id}', name: 'textdocument_update', methods: ['PUT'])]
    public function update(Request $request, TextDocument $textDocument, EntityManagerInterface $em): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        if ($textDocument->getProject()->getOwner() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Kein Zugriff auf dieses Dokument'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['content'])) {
            return new JsonResponse(['error' => 'Kein Inhalt übermittelt'], 400);
        }

        // Content direkt speichern (NICHT als JSON!)
        $textDocument->setContent($data['content']);
        $textDocument->setUpdatedAt(new \DateTimeImmutable());
        
        $em->flush();

        return new JsonResponse([
            'status' => 'success',
            'message' => 'Dokument aktualisiert',
            'document_id' => $textDocument->getId()
        ]);
    }
}