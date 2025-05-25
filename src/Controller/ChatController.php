<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class ChatController extends AbstractController
{
    #[Route('/api/llm/chat', name: 'llm_chat', methods: ['POST'])]
    public function chat(Request $request, HttpClientInterface $http): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $prompt = $data['prompt'] ?? null;

        if (!$prompt) {
            return new JsonResponse(['error' => 'Kein Prompt gesendet.'], 400);
        }

        try {
            $response = $http->request('POST', 'http://host.docker.internal:11434/api/generate', [
                'json' => [
                    'model' => 'openhermes',
                    'prompt' => $prompt,
                    'stream' => false
                ]
            ]);

            $contentType = $response->getHeaders()['content-type'][0] ?? '';

            if (strpos($contentType, 'application/json') === false) {
                return new JsonResponse([
                    'error' => 'Ungültiger Inhalt vom LLM erhalten.',
                    'content_type' => $contentType,
                    'raw' => $response->getContent(false)
                ], 500);
            }

            $content = $response->toArray(false);

            if (!isset($content['response'])) {
                return new JsonResponse([
                    'error' => 'LLM hat keine gültige Antwort geliefert.',
                    'antwort' => $content
                ], 500);
            }

            return new JsonResponse(['response' => $content['response']]);

        } catch (\Throwable $e) {
            return new JsonResponse([
                'error' => 'Fehler beim Abrufen vom LLM.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
