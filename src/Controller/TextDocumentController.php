<?php

namespace App\Controller;

use App\Entity\TextDocument;
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
}
