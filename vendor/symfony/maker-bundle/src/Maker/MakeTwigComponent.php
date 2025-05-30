<?php

/*
 * This file is part of the Symfony MakerBundle package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Bundle\MakerBundle\Maker;

use Symfony\Bundle\MakerBundle\ConsoleStyle;
use Symfony\Bundle\MakerBundle\DependencyBuilder;
use Symfony\Bundle\MakerBundle\Exception\RuntimeCommandException;
use Symfony\Bundle\MakerBundle\FileManager;
use Symfony\Bundle\MakerBundle\Generator;
use Symfony\Bundle\MakerBundle\InputConfiguration;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Yaml\Yaml;
use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * @author Kevin Bond <kevinbond@gmail.com>
 */
final class MakeTwigComponent extends AbstractMaker
{
    private string $namespace = 'Twig\\Components';

    public function __construct(private FileManager $fileManager)
    {
    }

    public static function getCommandName(): string
    {
        return 'make:twig-component';
    }

    public static function getCommandDescription(): string
    {
        return 'Create a Twig (or Live) component';
    }

    public function configureCommand(Command $command, InputConfiguration $inputConfig): void
    {
        $command
            ->setDescription(self::getCommandDescription())
            ->addArgument('name', InputArgument::OPTIONAL, 'The name of your Twig component (ie <fg=yellow>Notification</>)')
            ->addOption('live', null, InputOption::VALUE_NONE, 'Whether to create a Live component (requires <fg=yellow>symfony/ux-live-component</>)')
        ;
    }

    public function configureDependencies(DependencyBuilder $dependencies): void
    {
        $dependencies->addClassDependency(AsTwigComponent::class, 'symfony/ux-twig-component');
    }

    public function generate(InputInterface $input, ConsoleStyle $io, Generator $generator): void
    {
        $name = $input->getArgument('name');
        $live = $input->getOption('live');

        if ($live && !class_exists(AsLiveComponent::class)) {
            throw new \RuntimeException('You must install symfony/ux-live-component to create a Live component (composer require symfony/ux-live-component)');
        }

        $factory = $generator->createClassNameDetails(
            $name,
            str_replace($generator->getRootNamespace().'\\', '', $this->namespace),
        );

        $templatePath = str_replace('\\', '/', $factory->getRelativeNameWithoutSuffix());
        $shortName = str_replace('\\', ':', $factory->getRelativeNameWithoutSuffix());

        $generator->generateClass(
            $factory->getFullName(),
            \sprintf('%s/templates/twig/%s', \dirname(__DIR__, 2), $live ? 'LiveComponent.tpl.php' : 'Component.tpl.php'),
            [
                'live' => $live,
            ]
        );
        $generator->generateTemplate(
            "components/{$templatePath}.html.twig",
            \sprintf('%s/templates/twig/%s', \dirname(__DIR__, 2), 'component_template.tpl.php')
        );

        $generator->writeChanges();

        $this->writeSuccessMessage($io);
        $io->newLine();
        $io->writeln(" To render the component, use <fg=yellow><twig:{$shortName} /></>.");
        $io->newLine();
    }

    public function interact(InputInterface $input, ConsoleStyle $io, Command $command): void
    {
        if (!$input->getOption('live')) {
            $input->setOption('live', $io->confirm('Make this a Live component?', false));
        }

        $path = 'config/packages/twig_component.yaml';

        if (!$this->fileManager->fileExists($path)) {
            return;
        }

        try {
            $value = Yaml::parse($this->fileManager->getFileContents($path));
            $this->namespace = array_key_first($value['twig_component']['defaults']);
        } catch (\Throwable $throwable) {
            throw new RuntimeCommandException(message: 'Unable to parse config/packages/twig_component.yaml', previous: $throwable);
        }
    }
}
