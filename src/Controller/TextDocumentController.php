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
    #[Route('/api/textdocument/{id}', name: 'textdocument_update', methods: ['PUT'])]
    public function update(Request $request, TextDocument $textDocument, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content'])) {
            return new JsonResponse(['error' => 'Kein Inhalt übermittelt'], 400);
        }

        $textDocument->setContent(json_encode($data['content']));
        $em->flush();

        return new JsonResponse(['status' => 'OK']);
    }

    #[Route('/api/textdocument/save', name: 'textdocument_save', methods: ['POST'])]
    public function save(Request $request, EntityManagerInterface $em, ProjectRepository $projectRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['content']) || !isset($data['project_id'])) {
            return new JsonResponse(['error' => 'Inhalt und Projekt-ID sind erforderlich'], 400);
        }

        $project = $projectRepository->find($data['project_id']);
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